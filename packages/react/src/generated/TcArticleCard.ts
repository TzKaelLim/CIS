'use client';
import * as React from 'react';
import { createComponent } from '@lit/react';
import { TcArticleCard as TcArticleCardElement } from '@tzuchi/components/article-card/class';
import '@tzuchi/components/article-card';

export const TcArticleCard = createComponent({
  tagName: 'tc-article-card',
  elementClass: TcArticleCardElement,
  react: React,
  events: {
    onTcCardClick: 'tc-card-click'
  },
});
