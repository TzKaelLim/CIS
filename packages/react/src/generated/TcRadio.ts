'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcRadio as TcRadioElement } from '@tzuchi/components/radio/class';
import '@tzuchi/components/radio';

export const TcRadio = createComponent({
  tagName: 'tc-radio',
  elementClass: TcRadioElement,
  react: React,
  events: {
    onTcChange: 'tc-change'
  },
});
