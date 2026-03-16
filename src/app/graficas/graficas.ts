import { Component, OnInit, inject } from '@angular/core';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-graficas',
  imports: [ChartModule],
  templateUrl: './graficas.html',
  styleUrl: './graficas.css',
})
export class Graficas implements OnInit {
  data: any;
  options: any;

  ngOnInit() {
    this.initChart();
  }

  initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    this.data = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          type: 'bar',
          label: 'Pagos bonificacion',
          backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
          data: [50, 25, 12, 48, 90, 76, 42],
          borderRadius: 30,
          borderSkipped: 'bottom', // Aqui es donde se define donde no se aplica el radius
          barThickness: 30,
        },
        {
          type: 'bar',
          label: 'Descuentos a empleados',
          backgroundColor: documentStyle.getPropertyValue('--p-gray-500'),
          data: [21, 84, 24, 75, 37, 65, 34],
          borderRadius: 30,
          borderSkipped: 'bottom',
          barThickness: 30,
        },
        {
          type: 'bar',
          label: 'Total de nomina pagada',
          backgroundColor: documentStyle.getPropertyValue('--p-orange-500'),
          data: [41, 52, 24, 74, 23, 21, 32],
          borderRadius: 30,
          borderSkipped: 'bottom',
          barThickness: 30,
        },
      ],
    };

    this.options = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };
  }
}
