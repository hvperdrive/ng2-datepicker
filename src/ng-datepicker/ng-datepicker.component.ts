import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, HostListener, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addHours,
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
  hourChar: string; // default: 'h'
}

interface Day {
  date: Date;
  day: number;
  month: number;
  year: number;
  inThisMonth: boolean;
  isSelected: boolean;
  isPast: boolean;
  isDisabled: boolean;
}

interface Hour {
  value: number;
  hour: string;
  isDisabled: boolean;
  isSelected: boolean;
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
  day: Day;
  hour: Hour;
  barTitle: string;
  barTitleFormat: string;
  isPrevMonthAvailable: boolean;
  firstCalendarDay: number;
  dayNames: string[];
  scrollOptions: ISlimScrollOptions;
  days: Day[];
  hours: Hour[];
  locale: any;
  hourChar: string;
  defaultHours: number[] = [9, 10, 11, 13, 14, 15, 16];

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
    this.hourChar = this.options && this.options.hourChar || 'h';
  }

  nextMonth(): void {
    this.date = addMonths(this.date, 1);
    this.init();
  }

  prevMonth(): void {
    this.date = subMonths(this.date, 1);
    this.init();
  }

  setDate(day, hour): void {
    this.date = addHours(this.day.date, this.hour.value);
    this.value = this.date;
  }

  setDay(i: number): void {
    this.day = this.days[i];

    // loop over days and unselect currently selected
    // + select newly selected day
    this.days = this.days.map((day, index) => {
      day.isSelected = false;
      if (i === index) {
        day.isSelected = true;
      }
      return day;
    });

    if (!this.day.inThisMonth) {
      this.init();
    }

    this.initHours();
  }

  setHour(i: number): void {
    this.hour = this.hours[i];

    this.hours = this.hours.map((hour, index) => {
      hour.isSelected = false;
      if (i === index) {
        hour.isSelected = true;
      }
      return hour;
    });

    this.setDate(this.day, this.hour);
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
        isDisabled: this.isDisabledDate(date)
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
        isDisabled: this.isDisabledDate(date)
      });
    }

    this.initHours();

    this.isPrevMonthAvailable = !isThisMonth(start);
    this.barTitle = format(start, this.barTitleFormat, { locale: this.locale });
    if (this.innerValue) {
      this.displayValue = format(this.innerValue, this.displayFormat, { locale: this.locale });
    }
  }

  initHours(): void {
    this.hours = this.defaultHours.map(hour => {
      return {
        value: hour,
        hour: `${hour}${this.hourChar}`,
        isDisabled: this.isDisabledHour(null, hour),
        isSelected: this.hour && this.hour.value === hour,
      };
    });
  }

  initDayNames(): void {
    this.dayNames = [];
    const start = this.firstCalendarDay;
    for (let i = start; i <= 6 + start; i++) {
      const date = setDay(new Date(), i);
      this.dayNames.push(format(date, 'dd', { locale: this.locale }).toUpperCase().charAt(0));
    }
  }

  isDisabledDate(date: any): boolean {
    // TODO: IMPLEMENT FUNCTION HERE THAT CHECKS TIMESLOTS FOR THAT DAY
    // AND DISABLES THE CURRENT DATE WHEN ALL TIMESLOTS ARE FILLED
    return Math.random() > 0.85;
  }

  isDisabledHour(date: any, hour: any): boolean {
    // TODO: IMPLEMENT FUNCTION HERE THAT CHECKS IF TIMESLOT
    // IS AVAILABLE FOR GIVEN DATE
    // NO DAY GIVEN (on load) --> disable all timeslots
    if (!this.day) {
      return true;
    }

    return Math.random() > 0.50;
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
