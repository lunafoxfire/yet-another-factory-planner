import React from 'react';

const PaypalButton = () => {
  return (
    <form action="https://www.paypal.com/donate" method="post" target="_blank" style={{ opacity: '0.8' }}>
      <input type="hidden" name="business" value="EN9ZT88D25SRS" />
      <input type="hidden" name="no_recurring" value="1" />
      <input type="hidden" name="item_name" value="Wow, I didn't expect anyone to click this button! It honestly means a lot! I will put this money towards a nice coffee :P" />
      <input type="hidden" name="currency_code" value="USD" />
      <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
      <img alt="" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
    </form>
  );
};

export default PaypalButton;
