'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcDropdown as TcDropdownElement } from '@tzuchi/components/dropdown/class';
import '@tzuchi/components/dropdown';

export const TcDropdown = createComponent({
  tagName: 'tc-dropdown',
  elementClass: TcDropdownElement,
  react: React,
  events: {
    onTcChange: 'tc-change'
  },
});
