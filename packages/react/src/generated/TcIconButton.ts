'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcIconButton as TcIconButtonElement } from '@tzuchi/components/icon-button/class';
import '@tzuchi/components/icon-button';

export const TcIconButton = createComponent({
  tagName: 'tc-icon-button',
  elementClass: TcIconButtonElement,
  react: React,
  events: {},
});
