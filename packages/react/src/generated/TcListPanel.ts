'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcListPanel as TcListPanelElement } from '@tzuchi/components/list-panel/class';
import '@tzuchi/components/list-panel';

export const TcListPanel = createComponent({
  tagName: 'tc-list-panel',
  elementClass: TcListPanelElement,
  react: React,
  events: {},
});
