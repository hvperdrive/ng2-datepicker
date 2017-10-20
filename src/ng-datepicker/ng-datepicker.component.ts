import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, HostListener, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  setYear,
  eachDay,
  getDate,
  getMonth,
  getYear,
  isPast,
  isToday,
  isSameDay,
  isSameMonth,
  isSameYear,
  isThisMonth,
  format,
  getDay,
  subDays,
  setDay
} from 'date-fns';
import { ISlimScrollOptions } from 'ngx-slimscroll';
import * as defaultLocale from 'date-fns/locale/en';

export interface DatepickerOptions {
  locale?: any; // default: english 'date-fns/locale/en'
}

@Component({
  selector: 'ng-datepicker',
  templateUrl: 'ng-datepicker.component.html',
  styleUrls: ['ng-datepicker.component.sass'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgDatepickerComponent), multi: true }
  ]
})
export class NgDatepickerComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() options: DatepickerOptions;

  isOpened: boolean;
  innerValue: Date;
  displayValue: string;
  displayFormat: string;
  date: Date;
  barTitle: string;
  barTitleFormat: string;
  isPrevMonthAvailable: boolean;
  firstCalendarDay: number;
  dayNames: string[];
  scrollOptions: ISlimScrollOptions;
  days: {
    date: Date;
    day: number;
    month: number;
    year: number;
    inThisMonth: boolean;
    isSelected: boolean;
    isPast: boolean;
    isDisabled: boolean;
  }[];
  locale: any;

  private onTouchedCallback: () => void = () => { };
  private onChangeCallback: (_: any) => void = () => { };

  get value(): Date {
    return this.innerValue;
  }

  set value(val: Date) {
    this.innerValue = val;
    this.onChangeCallback(this.innerValue);
  }

  constructor(private elementRef: ElementRef) {
    this.scrollOptions = {
      barBackground: '#DFE3E9',
      gridBackground: '#FFFFFF',
      barBorderRadius: '3',
      gridBorderRadius: '3',
      barWidth: '6',
      gridWidth: '6',
      barMargin: '0',
      gridMargin: '0'
    };
  }

  ngOnInit() {
    this.date = new Date();
    this.setOptions();
    this.initDayNames();
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('options' in changes) {
      this.setOptions();
      this.initDayNames();
      this.init();
    }
  }

  setOptions(): void {
    this.displayFormat = 'MMM D[,] YYYY';
    this.barTitleFormat = 'MMMM YYYY';
    this.firstCalendarDay = 1; // 1 = Monday

    this.locale = this.options && this.options.locale || defaultLocale;
  }

  nextMonth(): void {
    this.date = addMonths(this.date, 1);
    this.init();
  }

  prevMonth(): void {
    this.date = subMonths(this.date, 1);
    this.init();
  }

  setDate(i: number): void {
    this.date = this.days[i].date;
    this.value = this.date;
    this.init();
  }

  init(): void {
    const start = startOfMonth(this.date);
    const end = endOfMonth(this.date);

    this.days = eachDay(start, end).map(date => {
      return {
        date: date,
        day: getDate(date),
        month: getMonth(date),
        year: getYear(date),
        inThisMonth: true,
        isSelected: isSameDay(date, this.innerValue) && isSameMonth(date, this.innerValue) && isSameYear(date, this.innerValue),
        isPast: isPast(date) && !isToday(date),
        isDisabled: this.isDisabled(date)
      };
    });

   for (let i = 1; i <= getDay(subDays(start, this.firstCalendarDay)); i++) {
      const date = subDays(start, i);
      this.days.unshift({
        date: date,
        day: getDate(date),
        month: getMonth(date),
        year: getYear(date),
        inThisMonth: false,
        isSelected: isSameDay(date, this.innerValue) && isSameMonth(date, this.innerValue) && isSameYear(date, this.innerValue),
        isPast: isPast(date) && !isToday(date),
        isDisabled: this.isDisabled(date)
      });
    }

    this.isPrevMonthAvailable = !isThisMonth(start);
    this.barTitle = format(start, this.barTitleFormat, { locale: this.locale });
    if (this.innerValue) {
      this.displayValue = format(this.innerValue, this.displayFormat, { locale: this.locale });
    }
  }

  initDayNames(): void {
    this.dayNames = [];
    const start = this.firstCalendarDay;
    for (let i = start; i <= 6 + start; i++) {
      const date = setDay(new Date(), i);
      this.dayNames.push(format(date, 'dd', { locale: this.locale }).toUpperCase().charAt(0));
    }
  }

  isDisabled(date: any): boolean {
    // TODO: IMPLEMENT FUNCTION HERE THAT CHECKS TIMESLOTS FOR THAT DAY
    // AND DISABLES THE CURRENT DATE WHEN ALL TIMESLOTS ARE FILLED
    return Math.random() > 0.85;
  }

  toggle(): void {
    this.isOpened = !this.isOpened;
  }

  close(): void {
    this.isOpened = false;
  }

  writeValue(val: Date) {
    if (val) {
      this.date = val;
      this.innerValue = val;
      this.init();
      this.displayValue = format(this.innerValue, this.displayFormat, { locale: this.locale });
      this.barTitle = format(startOfMonth(val), this.barTitleFormat, { locale: this.locale });
    }
  }

  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  @HostListener('document:click', ['$event']) onBlur(e: MouseEvent) {
    if (!this.isOpened) {
      return;
    }

    const input = this.elementRef.nativeElement.querySelector('.ngx-datepicker-input');
    if (e.target === input || input.contains(<any>e.target)) {
      return;
    }

    const container = this.elementRef.nativeElement.querySelector('.ngx-datepicker-calendar-container');
    if (
      container &&
      container !== e.target &&
      !container.contains(<any>e.target) &&
      !(<any>e.target).classList.contains('day-unit')) {
      this.close();
    }
  }
}
