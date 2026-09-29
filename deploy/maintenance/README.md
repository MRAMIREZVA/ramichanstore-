# Scripts de mantenimiento — limpiar datos de prueba en producción

Estos scripts existen para que el dueño pueda limpiar pedidos web, ventas
y clientes de prueba **sin depender de una sesión de Claude Code** cada
vez. Nacieron después de una limpieza real (pedidos web de prueba,
2026-09-29) — en vez de repetir esas mismas consultas SQL a mano la
próxima vez, quedan acá como scripts reutilizables.

## Cómo correrlos

Conectarse al servidor por SSH y entrar a esta carpeta:

```
ssh root@159.223.157.216
cd /root/ramichanstore/deploy/maintenance
```

(Si el servidor no tiene la versión más reciente de estos scripts, primero
`cd /root/ramichanstore && git pull`.)

Cada script se corre así, con `./` adelante:

```
./listar-pedidos-web.sh
./borrar-pedidos-web.sh 5 6 7
```

Si un script no tiene permiso de ejecución (`Permission denied`), correr una
sola vez: `chmod +x *.sh`.

## Principio de seguridad: todo es borrado lógico, todo es reversible

Ninguno de estos scripts hace un `DELETE` físico — todos marcan la fila con
`deleted_at` (el mismo mecanismo que usa el botón "Eliminar" en cualquier
pantalla del admin). Eso significa:

- Una vez borrado, el registro desaparece de todas las pantallas y reportes,
  exactamente como si se hubiera borrado desde la UI.
- **Siempre se puede deshacer** con `restaurar.sh`, sin necesidad de restaurar
  un backup completo.
- No generan una entrada en Auditoría (a diferencia de borrar algo desde la
  propia UI del admin) — están pensados para limpieza de datos de prueba,
  no para el uso normal del negocio.

## Los scripts

### `listar-pedidos-web.sh` / `borrar-pedidos-web.sh`

Pedidos web = lo que llega del carrito del catálogo público (pestaña
"Pedidos web" dentro de Pedidos). `listar-pedidos-web.sh` los muestra todos
(id, estado, nombre/teléfono del cliente, si ya se convirtió a una venta) para
decidir cuáles son de prueba. `borrar-pedidos-web.sh` los borra por id, o
todos de una vez con `--todos`.

**Ojo con los que ya se convirtieron a una venta real** (columna
`converted_sale_id`): borrar el pedido web NO borra esa venta — son cosas
separadas. Si la venta resultante también es de prueba, hay que borrarla
aparte con `borrar-ventas.sh` (el propio `borrar-pedidos-web.sh` avisa cuáles
quedan en ese caso antes de pedir confirmación).

### `listar-ventas.sh` / `borrar-ventas.sh`

Ventas y separaciones viven en la misma tabla desde la Fase 40.
`listar-ventas.sh` muestra las últimas 50 (o filtra por nombre de cliente:
`./listar-ventas.sh "Mauricio"`).

`borrar-ventas.sh` **solo borra ventas que ya estén Canceladas**. Si alguna
sigue activa, el script se niega por completo y no borra nada — primero hay
que cancelarla de verdad desde el propio admin (Pedidos → Ventas → abrir la
venta → "Cancelar venta"). Es así a propósito: solo esa acción revierte el
stock y los puntos de fidelidad correctamente; borrar una venta activa a la
fuerza dejaría el stock y los puntos del cliente mal para siempre, sin
ningún aviso.

### `verificar-cliente.sh` / `borrar-cliente.sh`

Antes de borrar un cliente, `verificar-cliente.sh <id>` revisa si tiene algo
enganchado: ventas activas, movimientos de puntos, entregas o reservas de
preventa. Si tiene alguno, dice cuál y por qué bloquea el borrado.

`borrar-cliente.sh` corre esa misma revisión antes de borrar, y **no tiene
forma de forzarlo** si algo bloquea — a diferencia de las ventas, acá no hay
opción segura de "igual bórralo": un cliente con movimientos de puntos
revienta la pantalla de Puntos apenas se borra, porque esa pantalla necesita
leer el nombre del cliente de cada movimiento y los movimientos de puntos son
un historial que nunca se edita ni se borra. Si un cliente queda bloqueado
por eso, la única forma de "ocultarlo" de verdad sería borrar también esos
movimientos de puntos — y eso no lo hace ningún script de esta carpeta a
propósito, porque rompe la regla del proyecto de que ese historial es
inmutable.

### `restaurar.sh`

Deshace cualquiera de los borrados de arriba:

```
./restaurar.sh pedido-web 5 6 7
./restaurar.sh venta 3 4
./restaurar.sh cliente 195
```

## Ejemplo completo: limpiar una tanda de pruebas

```
# 1. Ver qué pedidos web hay
./listar-pedidos-web.sh

# 2. Borrarlos (avisa si alguno ya se convirtió a una venta real)
./borrar-pedidos-web.sh --todos

# 3. Si alguna de esas ventas también era de prueba: revisar que esté
#    Cancelada desde el admin, y luego
./borrar-ventas.sh 3 4

# 4. Si el pedido de prueba creó un cliente falso, primero revisar
./verificar-cliente.sh 195
#    y si sale "Seguro para borrar":
./borrar-cliente.sh 195
```
