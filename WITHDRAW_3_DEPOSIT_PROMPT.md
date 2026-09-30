# Withdrawal 3-Deposit Prompt

Updated NexusBet withdrawal flow:

- The 3-deposit withdrawal requirement remains enforced by the backend.
- After the user enters the required withdrawal information and clicks **Withdraw**, if the requirement has not been satisfied, the withdrawal panel shows this red prompt at the top:

  `MAKE 3 MORE DEPOSIT BEFORE YOU CAN WITHDRAW YOUR WINNINGS`

- The prompt is not shown before the user attempts the withdrawal.
- The same requirement is enforced server-side so it cannot be bypassed by the frontend.
