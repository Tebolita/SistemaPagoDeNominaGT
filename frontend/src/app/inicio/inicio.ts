import { Component } from '@angular/core';
import { BarraDeHerramientas } from '../barra-de-herramientas-fechas/barra-de-herramientas';
import { Graficas } from '../graficas/graficas';
@Component({
  selector: 'app-inicio',
  imports: [BarraDeHerramientas, Graficas],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {}
