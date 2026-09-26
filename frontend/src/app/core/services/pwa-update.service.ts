import { Injectable, NgZone, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Sin esto, alguien que instaló la PWA puede quedarse atascado para siempre
 * con el bundle viejo cacheado por el service worker — cada deploy nuevo
 * pasaría desapercibido. Apenas Angular detecta una versión nueva lista
 * (`VERSION_READY`), la activa y recarga la página sola, sin pedirle nada al
 * usuario. `isEnabled` es false en `ng serve`/si el navegador no soporta
 * service workers, así que esto no hace nada fuera de un build de producción.
 *
 * `versionUpdates` solo reacciona cuando el propio service worker decide
 * revisar `/ngsw.json` por su cuenta (al registrarse, o en su ciclo interno) —
 * eso puede tardar. Para no depender solo de eso, se fuerza `checkForUpdate()`
 * explícitamente cada vez que la pestaña vuelve a estar visible (el momento
 * más probable en que alguien reabre la PWA) y, como respaldo, cada 6 horas
 * si se queda abierta todo ese tiempo.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly ngZone = inject(NgZone);

  init(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      });

    // Fuera de la zona de Angular a propósito: un timer pendiente DENTRO de la zona nunca deja que
    // ApplicationRef.isStable llegue a true, y provideServiceWorker con "registerWhenStable:30000"
    // depende de eso para registrar rápido — con el timer adentro, el SW tardaría siempre el peor
    // caso (30s completos) en registrarse en vez de hacerlo apenas la app esté lista de verdad.
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.swUpdate.checkForUpdate();
      });
      setInterval(() => this.swUpdate.checkForUpdate(), SIX_HOURS_MS);
    });
  }
}
