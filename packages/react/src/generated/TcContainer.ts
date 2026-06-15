'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcContainer as TcContainerElement } from '@tzuchi/components/container/class';
import '@tzuchi/components/container';

export const TcContainer = createComponent({
  tagName: 'tc-container',
  elementClass: TcContainerElement,
  react: React,
  events: {},
});
