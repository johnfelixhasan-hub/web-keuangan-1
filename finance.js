export class transaction {
    constructor(type, category, amount, description) {
        this.type = type;
        this.category = category;
        this.amount = amount;
        this.description = description
    }
}
export class financemanager {
    constructor() {
        this.transaction = [];
    }
AddTransaction(transaction) {
    this.transaction.push(transaction);
}
gettotal(type) {
    return this.transaction
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}
getbalance() {
    return this.gettotal('income') - this.gettotal('outcome');
  }
}
