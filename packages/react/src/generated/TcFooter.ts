'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcFooter as TcFooterElement } from '@tzuchi/components/footer/class';
import '@tzuchi/components/footer';

export const TcFooter = createComponent({
  tagName: 'tc-footer',
  elementClass: TcFooterElement,
  react: React,
  events: {
    onTcBackToTop: 'tc-back-to-top'
  },
});
