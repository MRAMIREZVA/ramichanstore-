# Cómo subir RamichanStore a internet

Guía paso a paso para desplegar todo el sistema (base de datos + backend +
frontend) en un solo servidor económico, y para que tus vendedores/staff
entren con usuario y contraseña desde cualquier lugar.

## Qué vas a usar

Una sola VPS (servidor virtual) económica, con Docker. Ahí corren tres
contenedores: SQL Server, el backend (Spring Boot) y el frontend (Angular
servido por nginx, que también reenvía las llamadas a la API). Todo el
proyecto ya está preparado para esto — no hace falta tocar código, solo
variables de entorno.

**Costo aproximado: US$ 5-7/mes** (un solo servidor). Alternativas más caras
existen (Azure SQL Database gestionado, servicios separados para cada pieza),
pero para el tamaño de esta tienda esta opción es la más económica y sigue
siendo confiable.

### Proveedores recomendados para la VPS

Cualquiera de estos sirve — elige por precio/cercanía:

| Proveedor | Plan sugerido | Precio aprox. |
|---|---|---|
| **Hetzner Cloud** | CX22 (2 vCPU, 4GB RAM) | ~€4.5/mes |
| **DigitalOcean** | Basic Droplet 4GB | ~US$ 24/mes (o 2GB por ~US$12, más ajustado) |
| **Contabo** | VPS S | ~US$ 6/mes |

SQL Server necesita mínimo **2GB de RAM** para arrancar sin problemas — no
elijas un plan de 1GB. Recomendado: 4GB para tener margen.

## Paso 1: Crear el servidor

1. Crea una cuenta en el proveedor elegido.
2. Crea un servidor/droplet nuevo con **Ubuntu 22.04 LTS**, mínimo 2 vCPU / 4GB
   RAM, en la región más cercana a tus clientes (ej. una región de EE.UU. o
   São Paulo si el proveedor la tiene, para Perú).
3. Anota la **IP pública** del servidor.

## Paso 2: Instalar Docker en el servidor

Conéctate por SSH (`ssh root@TU_IP`) y ejecuta:

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git
```

## Paso 3: Subir el código al servidor

Necesitas el código en un repositorio Git (GitHub, GitLab, etc. — puede ser
privado) para poder clonarlo en el servidor. Desde tu máquina:

```bash
# Si el proyecto todavía no es un repo remoto:
cd C:\Users\MSI\Documents\RamichanStore
git remote add origin https://github.com/TU_USUARIO/ramichanstore.git
git push -u origin master
```

En el servidor:

```bash
git clone https://github.com/TU_USUARIO/ramichanstore.git
cd ramichanstore
```

## Paso 4: Configurar las variables de entorno

```bash
cp .env.example .env
nano .env
```

Completa con valores reales:
- `SA_PASSWORD` y `DB_PASSWORD`: contraseñas fuertes y distintas entre sí.
- `JWT_SECRET`: generar con `openssl rand -base64 64` y pegar el resultado.
- `CORS_ALLOWED_ORIGINS`: el dominio que vas a usar (ej. `https://ramichanstore.com`).
  Si todavía no tienes dominio, pon `http://TU_IP_PUBLICA` mientras tanto.

## Paso 5: Levantar todo

```bash
docker compose up -d --build
```

La primera vez tarda varios minutos (descarga SQL Server + compila el
backend + compila el frontend). Verifica que todo quedó arriba:

```bash
docker compose ps
docker compose logs -f backend   # busca la línea "Started RamichanStoreBackendApplication"
```

Si el backend no arranca, revisa `docker compose logs db-init` (crea la base
de datos y el usuario `ramichan_app` la primera vez — ver `deploy/db-init.sql`).

## Paso 6: Probar

Abre `http://TU_IP_PUBLICA` en el navegador. Deberías ver el login. Entra con
el usuario semilla: `admin` / `Admin123!`.

**Cambia esa contraseña de inmediato** desde Usuarios y Permisos → editar el
usuario `admin` → Restablecer contraseña.

## Paso 7 (recomendado): dominio propio + HTTPS

Sin esto, el sitio funciona pero por HTTP plano (contraseñas viajan sin
cifrar) — no lo dejes así para uso real.

1. Compra un dominio (Namecheap, GoDaddy, etc. — unos US$ 10-15/año) y apunta
   un registro **A** a la IP de tu servidor.
2. En el servidor, instala Caddy como proxy HTTPS automático (más simple que
   configurar certbot a mano):

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

3. Edita `/etc/caddy/Caddyfile` para que quede así (reemplaza el dominio; incluye
   `www` si vas a usarlo):

```
tu-dominio.com, www.tu-dominio.com {
    reverse_proxy localhost:8081
}
```

4. En `.env`, descomenta (o agrega) estas dos líneas y actualiza `CORS_ALLOWED_ORIGINS`:

```
FRONTEND_BIND=127.0.0.1
FRONTEND_PORT=8081
CORS_ALLOWED_ORIGINS=https://tu-dominio.com
```

   **Importante, verificado con una instalación real:** el contenedor del
   frontend debe quedar en un **puerto distinto a 80** (`8081` en el ejemplo),
   no solo en una IP distinta con el mismo puerto (`127.0.0.1:80`). Aunque
   parezca que no debería chocar (una es `127.0.0.1` y la otra `0.0.0.0`),
   Caddy escucha `:80` en modo dual-stack (IPv4+IPv6 a la vez) y el kernel de
   Linux lo trata como si reservara *todo* el puerto 80 — el contenedor no
   puede arrancar ("address already in use") aunque esté en una IP distinta.
   Usar un puerto interno diferente (8081) evita el problema por completo.

   **No edites `docker-compose.yml` a mano para esto** — usar las variables de
   entorno de arriba es justamente para que un futuro `git pull` no te borre
   este ajuste (`docker-compose.yml` sí se actualiza con el código; `.env`
   nunca se toca porque está en `.gitignore` y es específico de este servidor).

5. Reinicia:

```bash
docker compose up -d
systemctl restart caddy
```

Caddy obtiene el certificado HTTPS automáticamente (Let's Encrypt) la primera
vez que alguien visita el dominio.

## Cómo actualizar el sitio cuando cambies código

```bash
cd ramichanstore
git pull
docker compose up -d --build
```

Las migraciones de Flyway (`backend/src/main/resources/db/migration/`) se
aplican solas al arrancar el backend — no hace falta tocar la base de datos a mano.

## Cómo agregar más usuarios de staff (con acceso completo al panel)

Ya lo puedes hacer desde el propio sitio, sin tocar el servidor: **Usuarios y
Permisos → Nuevo usuario** (necesitas estar logueado como alguien con el
permiso `USER_CREATE`, que el rol ADMIN ya tiene).

## Cómo dar acceso de solo lectura a un cliente (portal)

Desde **Clientes → abre la ficha del cliente (ícono de identificación) →
Habilitar acceso al portal** — le pones un usuario y una contraseña ahí
mismo. El cliente entra en `https://tu-dominio.com/portal/login` y solo ve
sus propias compras y preventas; no puede editar nada ni ver el panel admin.

## Notas de seguridad para producción

- Cambia la contraseña del usuario `admin` semilla apenas entres la primera vez.
- `JWT_SECRET`, `SA_PASSWORD` y `DB_PASSWORD` en `.env` nunca deben subirse a
  Git (el archivo `.env` ya está en `.gitignore`).
- El backend corre con `SPRING_PROFILES_ACTIVE=prod`, que apaga Swagger UI
  (`/swagger-ui.html`) — no debe quedar expuesta la documentación de la API
  en un servidor público.
- **Backups automáticos diarios a DigitalOcean Spaces (ya configurado en producción).**
  `deploy/backup-db.sh` hace `BACKUP DATABASE` dentro del contenedor, copia el
  `.bak` al host y lo sube con `s3cmd` a un Space privado (`ramichanstore-backups`,
  región NYC3) — así el respaldo vive fuera del servidor: si el VPS se pierde
  o el disco falla, los datos siguen a salvo. Corre por cron todos los días a
  las 8:00 UTC (3am Perú), con log en `/var/log/ramichanstore-backup.log`.
  No borra backups viejos del Space a propósito (250GB incluidos en el plan
  es muchísimo más de lo que esta base de datos va a pesar en años — revisar
  el tamaño del bucket de vez en cuando es más seguro que un script de borrado
  automático con riesgo de eliminar algo que sí hacía falta).
  - Requiere `s3cmd` instalado (`apt install s3cmd`) y `/root/.s3cfg` con las
    credenciales del Space (Access Key/Secret Key de Spaces — **no** el token
    general de la API de DigitalOcean, son cosas distintas) — ese archivo
    **no se versiona**, vive solo en el servidor con permisos `600`.
  - Para restaurar un backup: descargarlo del Space (`s3cmd get s3://ramichanstore-backups/<archivo>.bak`),
    copiarlo dentro del contenedor (`docker compose cp <archivo>.bak sqlserver:/var/opt/mssql/backup/`)
    y correr `RESTORE DATABASE RamichanStoreDB FROM DISK = '/var/opt/mssql/backup/<archivo>.bak' WITH REPLACE`.
  - Comando para un backup manual puntual (fuera del cron): `./deploy/backup-db.sh`
    desde `/root/ramichanstore` en el servidor.
- **Firewall (ufw) activo en el servidor**, solo permite entrante: SSH (22),
  HTTP (80) y HTTPS (443) — todo lo demás queda bloqueado por defecto. El
  puerto de SQL Server (1433) nunca estuvo expuesto a Internet (solo es
  alcanzable entre contenedores de docker-compose), así que esto es una
  segunda capa de protección, no la única.
