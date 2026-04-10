import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vacacion } from './vacacion';

describe('Vacacion', () => {
  let component: Vacacion;
  let fixture: ComponentFixture<Vacacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vacacion],
    }).compileComponents();

    fixture = TestBed.createComponent(Vacacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
