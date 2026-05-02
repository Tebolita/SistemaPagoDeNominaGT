import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadoNomina } from './estado-nomina';

describe('EstadoNomina', () => {
  let component: EstadoNomina;
  let fixture: ComponentFixture<EstadoNomina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoNomina],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadoNomina);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
