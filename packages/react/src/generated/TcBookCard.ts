'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcBookCard as TcBookCardElement } from '@tzuchi/components/book-card/class';
import '@tzuchi/components/book-card';

export const TcBookCard = createComponent({
  tagName: 'tc-book-card',
  elementClass: TcBookCardElement,
  react: React,
  events: {
    onTcBookCardClick: 'tc-book-card-click'
  },
});
