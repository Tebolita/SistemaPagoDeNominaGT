import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarraDeHerramientas } from './barra-de-herramientas';

describe('BarraDeHerramientas', () => {
  let component: BarraDeHerramientas;
  let fixture: ComponentFixture<BarraDeHerramientas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraDeHerramientas],
    }).compileComponents();

    fixture = TestBed.createComponent(BarraDeHerramientas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
