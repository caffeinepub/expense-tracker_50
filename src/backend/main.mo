import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

actor {
  type Expense = {
    id : Nat;
    amount : Float;
    category : Text;
    note : Text;
    timestamp : Time.Time;
  };

  module Expense {
    public func compare(e1 : Expense, e2 : Expense) : Order.Order {
      Nat.compare(e1.id, e2.id);
    };
  };

  let expenses = Map.empty<Nat, Expense>();
  var nextId = 0;

  public shared ({ caller }) func addExpense(amount : Float, category : Text, note : Text) : async () {
    let expense : Expense = {
      id = nextId;
      amount;
      category;
      note;
      timestamp = Time.now();
    };
    expenses.add(nextId, expense);
    nextId += 1;
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not expenses.containsKey(id)) {
      Runtime.trap("Expense does not exist");
    };
    expenses.remove(id);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    expenses.values().toArray().sort();
  };
};
