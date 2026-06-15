'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcChip as TcChipElement } from '@tzuchi/components/chip/class';
import '@tzuchi/components/chip';

export const TcChip = createComponent({
  tagName: 'tc-chip',
  elementClass: TcChipElement,
  react: React,
  events: {
    onTcSelect: 'tc-select',
    onTcRemove: 'tc-remove'
  },
});
