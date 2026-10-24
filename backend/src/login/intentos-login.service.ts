import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface Registro {
  fallos: number;
  bloqueadoHasta: number;
}

/**
 * Bloqueo temporal de cuentas tras intentos fallidos de inicio de sesión
 * (ISO 25010 – Seguridad: resistencia a fuerza bruta). Vive en memoria: se reinicia con el
 * proceso, lo que basta para una sola instancia; con varias réplicas debe pasar a Redis/BD.
 */
@Injectable()
export class IntentosLoginService {
  static readonly MAX_INTENTOS = 5;
  static readonly BLOQUEO_MS = 15 * 60 * 1000;
  /** Tope de cuentas vigiladas: evita que usuarios inventados agoten la memoria. */
  static readonly MAX_REGISTROS = 10_000;

  private readonly registros = new Map<string, Registro>();

  private clave(username: string) {
    return username.trim().toLowerCase();
  }

  /** Lanza 429 si la cuenta está bloqueada. */
  verificar(username: string, ahora = Date.now()) {
    const r = this.registros.get(this.clave(username));
    if (r && r.bloqueadoHasta > ahora) {
      const minutos = Math.ceil((r.bloqueadoHasta - ahora) / 60000);
      throw new HttpException(
        `Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${minutos} min`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  registrarFallo(username: string, ahora = Date.now()) {
    if (this.registros.size >= IntentosLoginService.MAX_REGISTROS)
      this.purgar(ahora);
    const k = this.clave(username);
    const previo = this.registros.get(k);
    // Si el bloqueo anterior ya venció, se empieza a contar de cero
    const fallos =
      previo &&
      previo.bloqueadoHasta <= ahora &&
      previo.fallos >= IntentosLoginService.MAX_INTENTOS
        ? 1
        : (previo?.fallos ?? 0) + 1;
    const bloqueadoHasta =
      fallos >= IntentosLoginService.MAX_INTENTOS
        ? ahora + IntentosLoginService.BLOQUEO_MS
        : 0;
    this.registros.set(k, { fallos, bloqueadoHasta });
  }

  registrarExito(username: string) {
    this.registros.delete(this.clave(username));
  }

  /** Cuentas vigiladas en este momento (para pruebas y métricas). */
  get tamano() {
    return this.registros.size;
  }

  /**
   * Elimina los registros sin bloqueo vigente; si aún se supera el tope, descarta los más
   * antiguos (un Map conserva el orden de inserción).
   */
  private purgar(ahora: number) {
    for (const [k, r] of this.registros) {
      if (r.bloqueadoHasta <= ahora) this.registros.delete(k);
    }
    const exceso = this.registros.size - IntentosLoginService.MAX_REGISTROS + 1;
    if (exceso > 0) {
      for (const k of [...this.registros.keys()].slice(0, exceso))
        this.registros.delete(k);
    }
  }
}
