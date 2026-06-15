'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcEbookToolbar as TcEbookToolbarElement } from '@tzuchi/components/ebook-toolbar/class';
import '@tzuchi/components/ebook-toolbar';

export const TcEbookToolbar = createComponent({
  tagName: 'tc-ebook-toolbar',
  elementClass: TcEbookToolbarElement,
  react: React,
  events: {
    onTcBack: 'tc-back'
  },
});
