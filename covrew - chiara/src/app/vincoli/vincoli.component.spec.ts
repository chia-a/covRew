import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VincoliComponent } from './vincoli.component';

describe('VincoliComponent', () => {
  let component: VincoliComponent;
  let fixture: ComponentFixture<VincoliComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VincoliComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VincoliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
