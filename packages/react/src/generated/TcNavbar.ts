'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcNavbar as TcNavbarElement } from '@tzuchi/components/navbar/class';
import '@tzuchi/components/navbar';

export const TcNavbar = createComponent({
  tagName: 'tc-navbar',
  elementClass: TcNavbarElement,
  react: React,
  events: {
    onTcMenuToggle: 'tc-menu-toggle'
  },
});
