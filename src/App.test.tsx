import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('payment comparison UI', () => {
  beforeEach(() => localStorage.clear());

  it('shows an accessible validation error for missing manual rates', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }));
    expect(screen.getByRole('alert').textContent).toContain('결제 금액');
  });

  it('renders a ranked comparison from user-entered rates', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('결제 예정일'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('결제 금액'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('공통 환율'), { target: { value: '900' } });
    fireEvent.change(screen.getByLabelText('USD/KRW 환율'), { target: { value: '1400' } });
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }));

    expect(screen.getByRole('heading', { name: '결제 방법 비교' })).toBeTruthy();
    expect(screen.getAllByText('트래블월렛').length).toBeGreaterThan(0);
    expect(screen.getAllByText('토스뱅크').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Naver Pay 해외 QR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('신한 Air 1.5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('89,800원').length).toBeGreaterThan(0);
  });

  it('clears saved history only after the explicit second reset action', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('결제 예정일'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('결제 금액'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('공통 환율'), { target: { value: '900' } });
    fireEvent.change(screen.getByLabelText('USD/KRW 환율'), { target: { value: '1400' } });
    fireEvent.click(screen.getByRole('button', { name: '비교하기' }));
    fireEvent.click(screen.getByRole('button', { name: '전체 초기화' }));
    expect(screen.getByRole('button', { name: '모두 지우기' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '모두 지우기' }));
    expect(screen.getByText('아직 저장된 비교가 없습니다.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '모두 지우기' })).toBeNull();
  });
});
