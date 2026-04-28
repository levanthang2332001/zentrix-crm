---
name: nestjs-setup
version: 1.0.0
description: |
  Scaffold a new NestJS module following the project's established patterns:
  module, service, controller, DTOs, spec tests, and proper module wiring.
  Use when the user says "add module", "create resource", "new endpoint",
  or "setup [entity]" in a NestJS project.
triggers:
  - add a new module
  - create a new resource
  - new endpoint
  - setup module
allowed-tools:
  - Bash
  - Read
  - Glob
  - Write
  - Edit
---

## Setup

Check the project structure exists and identify the target directory:
```bash
_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
echo "PROJECT_ROOT: $_ROOT"
echo "SRC_DIR: $_ROOT/src"
```

## Workflow

### Step 1: Gather module details

Ask the user (or infer from context) for:
1. **Module name** (e.g., `notification`, `subscriber`, `webhook`) — singular, lowercase, kebab-case for directory
2. **Entity/resource type** — what data does this handle?
3. **Endpoints** — list the HTTP methods and paths (e.g., `GET /resource`, `POST /resource`)

If the user already provided enough context (e.g., "add subscriber module"), skip to Step 2.

---

### Step 2: Determine the module path

**If the target is a new standalone module** (no parent module owns it):
```
src/{module-name}/
├── dto/
│   ├── create-{module-name}.dto.ts
│   └── update-{module-name}.dto.ts (optional)
├── {module-name}.controller.ts
├── {module-name}.controller.spec.ts
├── {module-name}.service.ts
├── {module-name}.service.spec.ts
└── {module-name}.module.ts
```

**If the target is nested under an existing module** (e.g., `subscriber/entities`):
```
src/{parent}/{child}/
├── dto/
│   └── create-{child}.dto.ts
├── {child}.controller.ts
├── {child}.service.ts
├── {child}.module.ts
└── {child}.service.spec.ts (optional)
```

---

### Step 3: Generate files

Create **all** files for the module. Follow the patterns from the existing codebase:

#### Module file (`{name}.module.ts`)
```typescript
import { Module } from '@nestjs/common';
import { {PascalName}Service } from './{name}.service';
import { {PascalName}Controller } from './{name}.controller';

@Module({
  providers: [{PascalName}Service],
  controllers: [{PascalName}Controller],
})
export class {PascalName}Module {}
```

#### Service file (`{name}.service.ts`)
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class {PascalName}Service {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: implement
}
```

#### Controller file (`{name}.controller.ts`)
```typescript
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { {PascalName}Service } from './{name}.service';

@ApiTags('{name}')
@Controller('{name}')
export class {PascalName}Controller {
  constructor(private readonly service: {PascalName}Service) {}
}
```

#### DTO file (`dto/create-{name}.dto.ts`)
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class Create{Name}Dto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

#### Spec files — follow existing patterns (e.g., `src/subscriber/subscriber.service.spec.ts`)

---

### Step 4: Register in parent module

If this is a standalone module, add it to `src/app.module.ts`:

```typescript
import { {PascalName}Module } from './{name}/{name}.module';

@Module({
  imports: [
    // ... existing imports
    {PascalName}Module,
  ],
})
export class AppModule {}
```

If nested under an existing module, update the parent's module file.

---

### Step 5: Verify

Run a build check to catch any issues:
```bash
cd "$_ROOT" && pnpm run build 2>&1 | head -30
```

If the build passes, report success. If it fails, fix the issue.

---

## Completion

Report what was created:
- Module files and their locations
- How it was wired into `AppModule`
- Any TODOs left for the user to implement