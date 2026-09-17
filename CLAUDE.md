# RamichanStore — Contexto del proyecto

> Lee este archivo completo antes de iniciar cualquier fase nueva. Está pensado para que una sesión nueva de Claude Code tenga todo el contexto sin tener que repreguntar nada de lo que ya se decidió.

## 1. Resumen del proyecto

**RamichanStore** es un sistema administrativo interno para una tienda de figuras y coleccionables anime. Permite al administrador controlar de forma centralizada: productos, inventario, costos y ganancias, preventas, clientes, puntos de fidelización, ventas, separaciones/pagos, entregas, proveedores, reportes y auditoría.

La arquitectura está preparada desde el inicio para incorporar más adelante un **portal de clientes** (autoregistro, catálogo, preventas, compras, puntos, historial) sin refactor mayor: la capa de servicios de dominio está separada de los controllers administrativos para poder reutilizarse desde futuros controllers de cliente.

Moneda: **soles peruanos (PEN)**. Locale: **es-PE**.

Dueño/administrador del proyecto: mramirezv2015@gmail.com (usuario semilla `admin`).

## 2. Estado actual: Fase 0 completada

La Fase 0 (arquitectura + scaffolding) está **terminada y verificada end-to-end** (compilación, migración de BD, login real contra el backend, render del frontend en navegador headless). A partir de aquí, el trabajo avanza **módulo por módulo** siguiendo el roadmap de la sección 9 — nunca todo de una vez.

Antes de empezar un módulo nuevo: leer este archivo, revisar el roadmap, y verificar que las relaciones con los módulos ya construidos (usuarios, auditoría, settings) sigan funcionando.

## 3. Stack y versiones exactas

| Componente | Versión | Notas |
|---|---|---|
| Backend | Spring Boot **4.1.1** | Ojo: la versión del parent POM es `4.1.1` (sin sufijo `.RELEASE` — Initializr lo muestra con `.RELEASE` en el id pero el artifact real de Maven Central no lo lleva) |
| Lenguaje backend | Java **21** (Eclipse Temurin) | `JAVA_HOME` configurado a nivel de máquina por el instalador |
| Build backend | Maven (via **Maven Wrapper** `mvnw`/`mvnw.cmd`) | No depende de una instalación global de Maven |
| Spring Framework | 7.0.9 | Viene con Boot 4.1.1 |
| Base de datos | SQL Server 2022 Express (`.\SQLEXPRESS`, local) | Ver sección 7 |
| Migraciones | Flyway (`flyway-core` + `flyway-sqlserver`) | `flyway-sqlserver` es obligatorio como dependencia explícita en versiones recientes de Flyway |
| Autenticación | JWT stateless (jjwt 0.12.6) + Spring Security | BCrypt para contraseñas |
| Docs API | springdoc-openapi 3.1.0 | `/swagger-ui.html` → redirige a `/swagger-ui/index.html` |
| Frontend | Angular **20.3.31** (CLI 20.0.4) | Standalone components, sin NgModules, nomenclatura de archivos sin sufijo `.component.` (`login.ts`, no `login.component.ts`) |
| UI Kit | Angular Material **20.2.14** (Material 3 / M3 theming) | `@angular/animations` fue necesario instalarlo aparte (el schematic `ng add` con `--defaults` no lo agregó) |
| Node / npm | v22.17.0 / 10.9.2 | |
| Control de versiones | Git (instalado durante esta sesión, no estaba en la máquina) | |

Herramientas que **no estaban instaladas** en esta máquina y se instalaron durante la Fase 0: JDK 21 (winget `EclipseAdoptium.Temurin.21.JDK`), Git (winget `Git.Git`, scope user porque el scope machine pedía elevación).

## 4. Arquitectura

Monorepo en `C:\Users\MSI\Documents\RamichanStore`:

```
RamichanStore/
├── CLAUDE.md              ← este archivo
├── backend/                Spring Boot (Maven Wrapper)
│   └── src/main/java/com/ramichanstore/backend/
│       ├── config/         SecurityConfig, CorsConfig, OpenApiConfig, JpaAuditingConfig, JacksonConfig
│       ├── security/       SecurityUser, CustomUserDetailsService, AuthEntryPointJwt, jwt/ (provider, filtro, properties)
│       ├── common/         BaseEntity (soft delete + auditoría), ApiResponse<T>, PageResponse<T>, GlobalExceptionHandler
│       ├── audit/          AuditLog, AuditAction, AuditService (punto único de auditoría, reutilizable desde cualquier módulo)
│       └── modules/
│           ├── auth/       login, refresh, me (construido)
│           ├── users/      entidades User/Role/Permission + repos (construido; falta CRUD UI → Fase 10)
│           ├── settings/   entidad Setting + servicio + controller (construido — aquí vive la regla de puntos)
│           └── products/, categories/, brands/, productlines/, suppliers/, inventory/,
│               customers/, preorders/, sales/, payments/, loyalty/, deliveries/, reports/
│               → paquetes placeholder (solo `package-info.java` documentando su fase, sin código todavía)
└── frontend/                Angular 20 + Angular Material
    └── src/app/
        ├── core/            guards, interceptors (jwt, error), services (auth, token-storage), models, constants (NAV_ITEMS)
        ├── layout/          main-layout, sidebar (roadmap completo, módulos no construidos = ícono de candado + tooltip), header
        └── features/
            ├── auth/login/  construido
            └── dashboard/   shell con cards placeholder (construido; datos reales llegan módulo por módulo)
```

**Decisiones de arquitectura clave:**

- **Separación dominio/controller pensando en el portal de clientes futuro.** Los `Service` de cada módulo no deben asumir que quien llama es un controller admin; cuando se construya el portal de clientes, sus controllers reutilizarán estos mismos servicios.
- **JWT stateless**, sin sesiones de servidor. Access token corto (1h por defecto) + refresh token largo (7 días). Dos niveles de autoridad por usuario: `ROLE_<nombre>` (para `hasRole`) y `PERM_<code>` (para autorización fina por permiso vía `@PreAuthorize("hasAuthority('PERM_...')")`).
- **Eliminación lógica obligatoria.** `BaseEntity` (id, createdAt, updatedAt, createdBy, updatedBy, deletedAt) + `@SQLRestriction("deleted_at IS NULL")` en las entidades que la usan. Nunca `DELETE FROM` en datos críticos.
- **Cálculos siempre en backend.** Ganancia, margen, totales de venta, puntos generados, cupos de preventa: nunca se calculan ni se aceptan editados desde el frontend.
- **Reglas de negocio configurables, nunca hardcodeadas.** La tabla `settings` (módulo `modules/settings`) guarda cosas como `LOYALTY_POINTS_PER_SOL`. `SettingService.getValue(key)` / `getNumber(key)` es el único punto de lectura; `updateValue(key, value)` es el único punto de escritura y genera auditoría automáticamente.
- **Auditoría centralizada.** `AuditService.log(action, module, entityName, entityId, oldValue, newValue)` es el único punto para registrar auditoría. Cualquier módulo nuevo que modifique datos sensibles (precios, stock, puntos, pagos) debe llamarlo.
- **`ApiResponse<T>` uniforme.** Todas las respuestas (éxito y error) tienen la forma `{ success, message, data, timestamp, errors }`. El frontend depende de este contrato (interceptors, snackbars de error).
- **Contrato del roadmap en el sidebar.** `frontend/src/app/core/constants/nav-items.ts` (`NAV_ITEMS`) es la fuente de verdad de qué módulos existen y en qué fase están. Al construir un módulo nuevo, cambiar su `available` a `true` y agregar su ruta real en `app.routes.ts`.

## 5. Spec funcional completa (resumen de los 21 puntos originales)

1. **Objetivo:** plataforma admin centralizada, preparada para portal de clientes futuro.
2. **Diseño:** dashboard moderno, menú lateral, responsive, tarjetas con indicadores, tablas profesionales, buscadores/filtros, modales crear/editar, confirmación antes de eliminar, alertas de stock bajo/pagos pendientes/preventas próximas. Identidad visual propia (no genérica).
3. **Autenticación:** login con usuario/correo + contraseña + recordarme. Preparado para roles futuros: Administrador, Vendedor, Almacén, Cliente (hoy solo existe ADMIN, pero el modelo de roles/permisos ya soporta agregar más).
4. **Dashboard:** ventas del día/mes, ganancia del mes, productos registrados, stock bajo, preventas activas/próximas, clientes registrados, puntos entregados, pagos pendientes; gráficos de ventas, ganancias, top productos/categorías, evolución de clientes, preventas activas; selector de rango de fechas.
5. **Productos:** SKU, nombre, personaje, franquicia, línea, marca, categoría, descripción, imágenes, tamaño, precio de compra, gastos adicionales, costo total (calculado), precio de venta, ganancia/margen (calculados, no editables directamente), stock actual/mínimo, estado (Disponible/Agotado/Preventa/Próximamente/Descontinuado), ubicación, fecha de ingreso, proveedor, observaciones.
6. **Inventario:** movimientos (Ingreso, Venta, Reserva, Separación, Devolución, Ajuste, Pérdida) con stock anterior/nuevo, usuario responsable, motivo, observación. Actualiza stock automáticamente y alerta en stock mínimo.
7. **Costos y ganancias:** costo de compra + gastos adicionales = costo total; precio de venta − costo total = ganancia. Rentabilidad consultable por producto/venta/cliente/mes/año/categoría/marca.
8. **Preventas:** producto, nombre, imagen, línea, marca, tamaño, precio, costo estimado, ganancia estimada, monto mínimo de separación, fecha inicio/límite/estimada de llegada, cantidad disponible/reservada, estado (Próximamente, Preventa activa, Agotada, En camino, Recibida, Entregada, Cancelada). Cupos disponibles = stock disponible − reservas.
9. **Clientes:** nombre, documento, teléfono, WhatsApp, correo, distrito, dirección, fecha registro, estado, observaciones, total comprado, número de compras, puntos ganados/usados/disponibles. Ficha con historial completo (compras, preventas, separaciones, pagos, entregas, puntos, productos comprados).
10. **Puntos:** regla configurable (no hardcodeada, ver `settings` → `LOYALTY_POINTS_PER_SOL`). Historial de movimientos: fecha, cliente, tipo (Compra/Canje/Ajuste manual/Bonificación/Vencimiento), puntos ganados/usados, motivo, compra relacionada, usuario responsable. Nunca modificar el saldo sin generar movimiento de auditoría.
11. **Ventas:** cliente, productos, cantidades, precio unitario, descuento, subtotal, total, método de pago (Yape/Plin/Transferencia/Efectivo/Tarjeta/Otros — configurable), estado de pago, método de entrega, fecha, observaciones. Backend calcula total, costo, ganancia y puntos generados.
12. **Separaciones y pagos:** cliente, producto, precio total, monto pagado, saldo pendiente, fecha separación/límite, estado (Pendiente/Parcial/Pagado/Cancelado/Vencido).
13. **Entregas:** cliente, pedido, productos, tipo de entrega, dirección, distrito, agencia, motorizado, recojo, fecha programada, estado (Pendiente/Preparando/Listo/Enviado/Entregado/Cancelado).
14. **Proveedores:** nombre, empresa, teléfono, WhatsApp, correo, país, dirección, observaciones. Relacionados con productos y compras.
15. **Reportes:** ventas, ganancias, inventario, top productos, bajo stock, preventas, clientes, puntos, pagos pendientes, separaciones, compras por período. Filtrables por fecha, exportables a Excel/PDF/CSV (fase futura).
16. **Configuración:** datos de la tienda, moneda, métodos de pago/entrega, regla de puntos, estados, categorías, marcas, líneas, proveedores, usuarios, roles, permisos.
17. **Auditoría:** usuario, acción, módulo, registro afectado, fecha/hora, valor anterior/nuevo. Ya implementada como infraestructura reutilizable (`AuditService`); falta la pantalla de consulta (Fase 11).
18. **Base de datos:** relacional, normalizada, con PKs/FKs/índices apropiados (ver sección 6).
19. **Arquitectura:** frontend/backend/BD/auth/servicios/modelos/controllers/validaciones separados; preparada para portal de clientes.
20. **Reglas transversales:** eliminación lógica, validación de formularios, sin datos duplicados, fechas/moneda peruana, toda operación importante auditada, cálculos siempre automáticos en backend, paginación en tablas grandes, búsqueda/filtros en todos los módulos, componentes reutilizables, buenas prácticas de seguridad, contraseñas nunca en texto plano.
21. **Fases:** no construir todo de una vez — MVP administrativo de 12 módulos (sección 9), diseñar arquitectura+BD primero, luego backend, luego frontend, verificando relaciones antes de avanzar.

## 6. Modelo de datos

19 entidades mínimas según el spec original. **Construidas en Fase 0** (existen físicamente en `RamichanStoreDB`): `roles`, `permissions`, `role_permissions`, `users`, `settings`, `audit_logs`.

**Pendientes** (se crean con una nueva migración Flyway `V2__...sql` en su fase correspondiente): `products`, `categories`, `brands`, `product_lines`, `suppliers`, `inventory`, `inventory_movements`, `customers`, `sales`, `sale_details`, `preorders`, `preorder_customers`, `payments`, `deliveries`, `loyalty_points`, `loyalty_point_movements`.

Convenciones DDL (ver `backend/src/main/resources/db/migration/V1__core_schema.sql` como referencia):
- `BIGINT IDENTITY(1,1)` como PK.
- `NVARCHAR` para todo texto (soporta nombres de personajes/franquicias en japonés/otros alfabetos).
- `DATETIME2` con `DEFAULT SYSUTCDATETIME()`.
- `BIT` para booleanos.
- Soft delete: columna `deleted_at DATETIME2 NULL` en toda entidad que lo requiera, con índice/constraint según corresponda.
- Auditoría de fila: `created_at`, `updated_at`, `created_by`, `updated_by` en entidades que extienden `BaseEntity` (no todas las tablas los necesitan — ver nota abajo).
- Cada tabla nueva de un módulo de negocio debe llevar FKs explícitas a `products`, `customers`, `users`, etc. según corresponda, con índices en las columnas de FK más consultadas.

**Nota sobre `BaseEntity`:** no todas las entidades lo extienden. `Role`, `Permission` y `User` sí (tienen las 4 columnas de auditoría + soft delete). `Setting` y `AuditLog` son entidades livianas con su propio manejo manual de timestamps porque no calzan con el patrón de soft-delete (un `AuditLog` nunca se edita ni se borra; un `Setting` se actualiza in-place, no se "elimina lógicamente"). Al crear una entidad nueva, decidir explícitamente si extiende `BaseEntity` o no, no por defecto.

## 7. Configuración y variables de entorno

Backend (`backend/src/main/resources/`):
- `application.yml`: config común, con defaults vía `${VAR:default}`. Perfil activo por defecto: `local`.
- `application-local.yml.example`: plantilla versionada en git.
- `application-local.yml`: **NO se versiona** (está en `.gitignore`). Ya existe en esta máquina con las credenciales reales (ver abajo).

Variables relevantes: `DB_URL` / `spring.datasource.url`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (mínimo 64 bytes aleatorios), `JWT_ACCESS_EXP_MS`, `JWT_REFRESH_EXP_MS`, `CORS_ALLOWED_ORIGINS`, `SERVER_PORT`.

**Base de datos local de esta máquina:**
- Instancia: `.\SQLEXPRESS` (SQL Server 2022 Express, Mixed Mode habilitado).
- Base de datos del proyecto: **`RamichanStoreDB`** (creada en Fase 0).
- Login dedicado de la app: **`ramichan_app`** (SQL login, rol `db_owner` sobre `RamichanStoreDB` únicamente), password generado aleatoriamente y guardado solo en `application-local.yml` (gitignored).
- Puerto TCP verificado: **1433** (`localhost:1433`).

  ⚠️ **Hallazgo importante:** en esa misma instancia SQL Server ya existía **otra base de datos llamada `RamichanStore`** (sin "DB") con un esquema propio en español (`Figuras`, `Marcas`, `Animes`, `LineasFiguras`, `Preventas`, `Ventas`, `Pedidos`, `Clientes`, `Direcciones`, `Envios`, `Kardex`, etc.), cada tabla con 1 fila de datos de prueba. El usuario confirmó que era una prueba sin relación con este proyecto y se dejó **intacta y sin usar**. El backend de RamichanStore usa exclusivamente `RamichanStoreDB`. Si en el futuro se decide reutilizar/migrar algo de esa base antigua, coordinarlo explícitamente con el usuario antes de tocarla — no asumir.

Frontend (`frontend/src/environments/`):
- `environment.ts` (dev): `apiBaseUrl: 'http://localhost:8080/api'`.
- `environment.production.ts`: `apiBaseUrl: '/api'` (asume reverse proxy en producción).

## 8. Comandos de desarrollo

Nota para PowerShell en esta máquina: `git`, `java`/`mvnw` y `node`/`npm` **no quedan en el PATH heredado por herramientas automatizadas** aunque sí están instalados — hay que anteponer sus carpetas al `$env:PATH` de la sesión antes de usarlos (`C:\Program Files\Git\cmd`, `C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin`, `C:\Program Files\nodejs`). En una terminal interactiva normal del usuario esto no debería hacer falta (el PATH de usuario/máquina ya los tiene).

**Backend** (desde `backend/`):
```
.\mvnw.cmd clean compile        # compilar
.\mvnw.cmd spring-boot:run      # levantar (perfil local, aplica migraciones Flyway automáticamente)
.\mvnw.cmd test                 # tests (requiere BD accesible para tests de integración)
```
Backend en `http://localhost:8080`. Swagger en `http://localhost:8080/swagger-ui.html`.

**Frontend** (desde `frontend/`):
```
npm start                                   # ng serve, http://localhost:4200
npm run build                               # build dev
ng build --configuration production         # build producción (budgets: 500kB warning / 1MB error, hoy ~463kB)
ng test                                     # Karma/Jasmine (requiere Chrome)
```

## 9. Roadmap de módulos (MVP administrativo)

- [x] **Fase 0 — Arquitectura y scaffolding.** Login, esqueleto de Dashboard, Usuarios/Roles/Permisos (solo entidades + backend, sin UI de gestión todavía), Configuración (solo `settings` de puntos/moneda vía API, sin UI todavía), Auditoría (infraestructura reutilizable, sin pantalla de consulta todavía). Verificado end-to-end: migración Flyway, login real, JWT, dashboard renderizado en navegador con la sesión del admin semilla.
- [ ] **Fase 1 — Productos.** `products`, `categories`, `brands`, `product_lines`, `suppliers`. Cálculo automático de costo total/ganancia/margen. CRUD + imágenes + filtros/búsqueda.
- [ ] **Fase 2 — Inventario.** `inventory_movements`, actualización automática de stock, alertas de stock mínimo.
- [ ] **Fase 3 — Clientes.** `customers`, ficha con historial (placeholders hasta que existan ventas/preventas/pagos).
- [ ] **Fase 4 — Preventas.** `preorders`, `preorder_customers`, cupos disponibles, estados.
- [ ] **Fase 5 — Ventas.** `sales`, `sale_details`, cálculo de total/costo/ganancia/puntos generados.
- [ ] **Fase 6 — Pagos y Separaciones.** `payments`, saldo pendiente, estados.
- [ ] **Fase 7 — Puntos.** `loyalty_points`, `loyalty_point_movements`, canje, uso de `SettingService` para la regla.
- [ ] **Fase 8 — Entregas.** `deliveries`, estados, métodos configurables.
- [ ] **Fase 9 — Reportes y Dashboard completo.** Gráficos reales (ventas, ganancias, top productos/categorías, evolución de clientes), exportación Excel/PDF/CSV, rangos de fecha.
- [ ] **Fase 10 — Usuarios y Permisos (UI completa).** CRUD de usuarios/roles/permisos sobre las entidades que ya existen desde Fase 0.
- [ ] **Fase 11 — Auditoría (UI completa).** Pantalla de consulta sobre `audit_logs` (ya se está poblando desde Fase 0).
- [ ] **Fase 12 — Configuración avanzada y Portal de clientes.** UI de configuración completa (categorías, marcas, líneas, métodos de pago/entrega, roles) + arranque del portal de clientes reutilizando los servicios de dominio existentes.

Al terminar cada fase: actualizar el checkbox aquí, marcar `available: true` y quitar el `phase` en el item correspondiente de `frontend/src/app/core/constants/nav-items.ts`, y agregar la ruta real en `app.routes.ts`.

## 10. Notas operativas

- **Usuario admin semilla:** `admin` / `Admin123!` (hash bcrypt real ya generado e insertado en `V1__core_schema.sql`). **Cambiar esta contraseña** en cuanto exista una pantalla de gestión de usuarios (Fase 10); mientras tanto, cambiarla manualmente vía `UPDATE users SET password_hash = ...` con un hash bcrypt nuevo si se despliega fuera de esta máquina de desarrollo.
- **Regenerar el hash bcrypt:** si se necesita otro, la forma usada en esta sesión fue un test JUnit temporal (`new BCryptPasswordEncoder().encode("...")`) ejecutado con `mvnw test -Dtest=...` y borrado después. No dejar ese tipo de test en el repo.
- **Flyway y checksums:** una vez que una migración (`V1__...`, `V2__...`) corrió contra una base de datos, no editar ese archivo — Flyway falla por checksum mismatch. Para cambios de schema, crear una migración nueva (`V2__...`).
- **La base `RamichanStore` (sin "DB") en `.\SQLEXPRESS` no es de este proyecto** (o al menos no se debe asumir que lo es) — ver sección 7. No ejecutar migraciones ni scripts destructivos contra ella sin confirmar con el usuario primero.
- Procesos de desarrollo (`mvnw spring-boot:run`, `npm start`) pueden haber quedado corriendo en background tras la sesión de Fase 0 — revisar puertos 8080/4200 antes de volver a lanzarlos para evitar `EADDRINUSE`.
