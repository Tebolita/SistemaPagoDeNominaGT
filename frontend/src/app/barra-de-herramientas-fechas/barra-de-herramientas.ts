import { Component, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { IftaLabelModule } from 'primeng/iftalabel';

@Component({
  selector: 'app-barra-de-herramientas',
  imports: [
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    SplitButtonModule,
    ToolbarModule,
    InputTextModule,
    SelectButtonModule,
    DatePickerModule,
    FormsModule,
    IftaLabelModule,
  ],
  templateUrl: './barra-de-herramientas.html',
  styleUrl: './barra-de-herramientas.css',
})
export class BarraDeHerramientas implements OnInit {
  // utilizamos la variable fecha para estraer la opcion seleccionada
  fecha: string = 'Hoy';
  stateOptions: any[] | undefined;

  // Esta variable nos ayuda para la busqueda personalizada
  fechasPersonalizadas: Date[] | undefined;

  ngOnInit() {
    this.stateOptions = [
      { label: 'Hoy' },
      { label: 'Esta semana' },
      { label: 'Este mes' },
      { label: 'Este año' },
      { label: 'Todo' },
    ];
  }
}
