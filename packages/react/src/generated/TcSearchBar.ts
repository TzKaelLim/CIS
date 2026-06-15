'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcSearchBar as TcSearchBarElement } from '@tzuchi/components/search-bar/class';
import '@tzuchi/components/search-bar';

export const TcSearchBar = createComponent({
  tagName: 'tc-search-bar',
  elementClass: TcSearchBarElement,
  react: React,
  events: {
    onTcSearch: 'tc-search',
    onTcInput: 'tc-input',
    onTcCategoryChange: 'tc-category-change'
  },
});
