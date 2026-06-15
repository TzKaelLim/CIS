'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcTabs as TcTabsElement } from '@tzuchi/components/tabs/class';
import '@tzuchi/components/tabs';

export const TcTabs = createComponent({
  tagName: 'tc-tabs',
  elementClass: TcTabsElement,
  react: React,
  events: {
    onTcTabChange: 'tc-tab-change'
  },
});
