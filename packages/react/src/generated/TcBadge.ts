'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcBadge as TcBadgeElement } from '@tzuchi/components/badge/class';
import '@tzuchi/components/badge';

export const TcBadge = createComponent({
  tagName: 'tc-badge',
  elementClass: TcBadgeElement,
  react: React,
  events: {},
});
