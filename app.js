//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js"); // Make sure date.js is implemented correctly
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-steve:Test123..@cluster0.hqwijmz.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });


const itemsScheme = {
  name: String
}

const Item = mongoose.model("Item", itemsScheme);

// Insert default items after defining the Item model and connecting to the database
const item1 = new Item({
  name: "Welcome to your task management system!"
});
const item2 = new Item({
  name: "Click the '+' button to add a new task and save it Mongo Database"
});
const item3 = new Item({
  name: "Use the checkbox to mark a task as completed, and it will be deleted from the database"
});
const defaultItems = [item1, item2, item3];
const listScheme = {
  name:String,
  items:[itemsScheme]
};
const List = mongoose.model("List", listScheme);



app.get("/", async function (req, res) {
  const day = date.getDate();
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      // Insert default items if the database is empty
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB");
      // Re-query for items after insertion
      const updatedItems = await Item.find({});
      res.render("list", { listTitle: day, newListItems: updatedItems });
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
  }
});
app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === date.getDate()) {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log("List not found");
        // Handle the case where the list doesn't exist
        res.status(404).send("List not found");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  
  if (listName === date.getDate()) {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted checked item");
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      if (foundList) {
        await foundList.updateOne({ $pull: { items: { _id: checkedItemId } } });
        res.redirect("/" + listName);
      } else {
        console.log("List not found");
        // Handle the case where the list doesn't exist
        res.status(404).send("List not found");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
});



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
