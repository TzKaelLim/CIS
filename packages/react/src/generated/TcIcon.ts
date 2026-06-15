'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcIcon as TcIconElement } from '@tzuchi/components/icon/class';
import '@tzuchi/components/icon';

export const TcIcon = createComponent({
  tagName: 'tc-icon',
  elementClass: TcIconElement,
  react: React,
  events: {},
});
