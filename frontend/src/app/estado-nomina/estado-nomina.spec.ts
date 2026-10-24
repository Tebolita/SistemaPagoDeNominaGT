import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadoNominaComponent } from './estado-nomina';

describe('EstadoNomina', () => {
  let component: EstadoNominaComponent;
  let fixture: ComponentFixture<EstadoNominaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoNominaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadoNominaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
