'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcCard as TcCardElement } from '@tzuchi/components/card/class';
import '@tzuchi/components/card';

export const TcCard = createComponent({
  tagName: 'tc-card',
  elementClass: TcCardElement,
  react: React,
  events: {
    onTcCardClick: 'tc-card-click'
  },
});
