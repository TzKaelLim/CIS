'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcGrid as TcGridElement } from '@tzuchi/components/grid/class';
import '@tzuchi/components/grid';

export const TcGrid = createComponent({
  tagName: 'tc-grid',
  elementClass: TcGridElement,
  react: React,
  events: {},
});
