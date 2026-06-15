'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcThemeToggle as TcThemeToggleElement } from '@tzuchi/components/theme-toggle/class';
import '@tzuchi/components/theme-toggle';

export const TcThemeToggle = createComponent({
  tagName: 'tc-theme-toggle',
  elementClass: TcThemeToggleElement,
  react: React,
  events: {
    onTcThemeChange: 'tc-theme-change'
  },
});
