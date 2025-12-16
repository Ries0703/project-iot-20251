# NestJS với SWC - Configuration Guide

## Tại sao dùng SWC?

SWC (Speedy Web Compiler) là một compiler được viết bằng Rust, nhanh hơn TypeScript compiler (tsc) rất nhiều:

- **Compilation speed**: 20-70x nhanh hơn tsc
- **Watch mode**: Hot reload cực nhanh
- **Memory usage**: Tiết kiệm RAM hơn

## Cấu hình đã thực hiện

### 1. Dependencies

```bash
npm install --save-dev @swc/cli @swc/core
```

### 2. nest-cli.json

```json
{
  "compilerOptions": {
    "deleteOutDir": true,
    "builder": "swc",        // Sử dụng SWC builder
    "typeCheck": true        // Vẫn check types với tsc
  }
}
```

### 3. .swcrc

```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "target": "es2021"
  },
  "module": {
    "type": "commonjs"
  }
}
```

## Performance Results

**Build time**: 
- Compiled 7 files in **164.74ms** ✨
- Watch mode startup: **111.01ms** ✨

**So với tsc**:
- tsc thường mất ~2-3 giây
- SWC chỉ mất ~100-200ms
- **Nhanh hơn ~15-20 lần!**

## Sử dụng

```bash
# Development mode with watch
npm run start:dev

# Production build
npm run build

# Start production
npm run start:prod
```

## Lưu ý

- SWC chỉ **transpile** code, không check types
- TypeScript type checking vẫn chạy song song (`typeCheck: true`)
- Decorators và metadata được hỗ trợ đầy đủ cho NestJS
- Source maps được enable để debug dễ dàng

## Next Steps

Với SWC đã hoạt động, backend sẽ compile và reload cực nhanh trong quá trình development!
