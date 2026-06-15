'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcInput as TcInputElement } from '@tzuchi/components/input/class';
import '@tzuchi/components/input';

export const TcInput = createComponent({
  tagName: 'tc-input',
  elementClass: TcInputElement,
  react: React,
  events: {
    onTcInput: 'tc-input',
    onTcChange: 'tc-change'
  },
});
