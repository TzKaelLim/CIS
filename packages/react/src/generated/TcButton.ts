'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcButton as TcButtonElement } from '@tzuchi/components/button/class';
import '@tzuchi/components/button';

export const TcButton = createComponent({
  tagName: 'tc-button',
  elementClass: TcButtonElement,
  react: React,
  events: {},
});
