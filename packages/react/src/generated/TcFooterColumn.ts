'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcFooterColumn as TcFooterColumnElement } from '@tzuchi/components/footer/class';
import '@tzuchi/components/footer';

export const TcFooterColumn = createComponent({
  tagName: 'tc-footer-column',
  elementClass: TcFooterColumnElement,
  react: React,
  events: {
    onTcToggle: 'tc-toggle'
  },
});
