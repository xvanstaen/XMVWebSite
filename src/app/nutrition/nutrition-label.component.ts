import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Goals, NUTRIENTS, Nutrients } from './models';

@Component({
  selector: 'app-nutrition-label',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="label" aria-labelledby="label-title">
      <h2 id="label-title">Nutrition Facts</h2>
      <p class="caption">{{ caption() }}</p>

      <div class="calories">
        <span>Calories</span>
        <strong [class.over]="caloriesOver()">{{ totals().calories | number: '1.0-0' }}</strong>
      </div>
      <p class="goal">of {{ goals().calories | number: '1.0-0' }} kcal goal</p>

      <div class="dv">% of goal</div>
      @for (row of rows(); track row.key) {
        <div class="row" [class.indent]="row.indent" [class.over]="row.over">
          <span>
            <span class="name">{{ row.label }}</span>
            {{ row.value | number: '1.0-1' }}{{ row.unit }}
          </span>
          <span class="pct">{{ row.pct }}%</span>
        </div>
      }
      <p class="foot">Percentages compare the day's total with the goals you set.</p>
    </section>
  `,
  styles: `
    :host { display: block; }
    .label {
      background: #fff;
      color: #000;
      border: 2px solid #000;
      padding: 0.5rem 0.75rem 0.75rem;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    h2 {
      margin: 0;
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
      padding-bottom: 0.3rem;
      border-bottom: 1px solid #000;
    }
    .caption { margin: 0.3rem 0; font-size: 0.9rem; }
    .calories {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 8px solid #000;
      padding: 0.25rem 0 0;
    }
    .calories span { font-size: 1.25rem; font-weight: 800; }
    .calories strong { font-size: 2.6rem; font-weight: 900; line-height: 1; }
    .goal { margin: 0.15rem 0 0.35rem; text-align: right; font-size: 0.8rem; }
    .dv {
      text-align: right;
      font-size: 0.8rem;
      font-weight: 700;
      border-top: 4px solid #000;
      border-bottom: 1px solid #000;
      padding: 0.2rem 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      border-bottom: 1px solid #000;
      padding: 0.25rem 0;
      font-size: 0.95rem;
      font-variant-numeric: tabular-nums;
    }
    .row.indent { padding-left: 1rem; }
    .row:not(.indent) .name { font-weight: 700; }
    .pct { font-weight: 700; }
    .over, .row.over .pct { color: var(--over); }
    .foot {
      margin: 0;
      padding-top: 0.4rem;
      border-top: 8px solid #000;
      font-size: 0.75rem;
      line-height: 1.3;
    }
  `,
})
export class NutritionLabelComponent {
  readonly totals = input.required<Nutrients>();
  readonly goals = input.required<Goals>();
  readonly caption = input('Daily total');

  protected readonly caloriesOver = computed(() => this.totals().calories > this.goals().calories);

  protected readonly rows = computed(() =>
    NUTRIENTS.filter((meta) => meta.key !== 'calories').map((meta) => {
      const value = this.totals()[meta.key];
      const goal = this.goals()[meta.key];
      return {
        ...meta,
        value,
        pct: goal > 0 ? Math.round((value / goal) * 100) : 0,
        over: !!meta.limit && goal > 0 && value > goal,
      };
    }),
  );
}
