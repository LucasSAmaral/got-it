import { describe, expect, it } from 'vitest'
import { instagramUrl, reservationMessage, whatsappUrl } from './reservation'

describe('reservationMessage', () => {
  it('leva título, editora, volume e ISBN', () => {
    expect(
      reservationMessage({ title: 'Homem-Aranha 2099', publisher: 'Panini', volume: '3', isbn13: '9788542620337' }, 'Lazarus'),
    ).toBe('Olá! Vi no Tem esse? que chegou na Lazarus: Homem-Aranha 2099 (Panini, vol. 3, ISBN 9788542620337). Ainda tem? Queria reservar.')
  })

  it('omite o que a edição não tem', () => {
    expect(reservationMessage({ title: 'Watchmen', publisher: null, volume: null, isbn13: null }, 'Lazarus')).toBe(
      'Olá! Vi no Tem esse? que chegou na Lazarus: Watchmen. Ainda tem? Queria reservar.',
    )
  })
})

describe('whatsappUrl', () => {
  it('codifica a mensagem na URL', () => {
    expect(whatsappUrl('5511999998888', 'Ainda tem? R$ 39,90 & tal')).toBe(
      'https://wa.me/5511999998888?text=Ainda%20tem%3F%20R%24%2039%2C90%20%26%20tal',
    )
  })
})

describe('instagramUrl', () => {
  it('abre o direct do perfil', () => {
    expect(instagramUrl('lazarus.hq')).toBe('https://ig.me/m/lazarus.hq')
  })
})
