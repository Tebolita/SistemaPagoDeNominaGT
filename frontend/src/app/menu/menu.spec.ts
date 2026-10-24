import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { MenuPrincipal } from './menu';

describe('Menu', () => {
  let component: MenuPrincipal;
  let fixture: ComponentFixture<MenuPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPrincipal],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuPrincipal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
