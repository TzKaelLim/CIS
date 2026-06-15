'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcLink as TcLinkElement } from '@tzuchi/components/link/class';
import '@tzuchi/components/link';

export const TcLink = createComponent({
  tagName: 'tc-link',
  elementClass: TcLinkElement,
  react: React,
  events: {
    onClick: 'click'
  },
});
