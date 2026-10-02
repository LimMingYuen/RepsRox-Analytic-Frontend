import { Component, ElementRef, afterRenderEffect, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * A Chart.js canvas. The chart is rebuilt whenever its config changes, which here
 * means new data: the pages hand over a fresh config from a computed signal.
 */
@Component({
  selector: 'app-chart',
  template: `<div class="frame" [style.height.px]="height()">
    <canvas #canvas role="img" [attr.aria-label]="label()"></canvas>
  </div>`,
  styles: `
    .frame {
      position: relative;
      width: 100%;
    }
  `,
})
export class ChartView {
  readonly config = input.required<ChartConfiguration>();
  readonly label = input.required<string>();
  readonly height = input(260);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterRenderEffect((cleanup) => {
      const chart = new Chart(this.canvas().nativeElement, this.config());
      cleanup(() => chart.destroy());
    });
  }
}
