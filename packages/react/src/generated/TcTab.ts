'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcTab as TcTabElement } from '@tzuchi/components/tabs/class';
import '@tzuchi/components/tabs';

export const TcTab = createComponent({
  tagName: 'tc-tab',
  elementClass: TcTabElement,
  react: React,
  events: {},
});
