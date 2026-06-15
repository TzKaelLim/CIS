'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcPagination as TcPaginationElement } from '@tzuchi/components/pagination/class';
import '@tzuchi/components/pagination';

export const TcPagination = createComponent({
  tagName: 'tc-pagination',
  elementClass: TcPaginationElement,
  react: React,
  events: {
    onTcPageChange: 'tc-page-change'
  },
});
