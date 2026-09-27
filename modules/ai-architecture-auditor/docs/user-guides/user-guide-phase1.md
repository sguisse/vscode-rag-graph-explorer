# 📘 User Guide — Evidence-Driven AI Software Architecture Auditor V4.1
## 📍 Phase 1 : Socle Architecture & Analyse Statique Java / Spring Boot

Ce guide d'utilisation détaille le fonctionnement pratique des composants et analyseurs de la plateforme, accompagné pour chaque analyseur d'un **exemple concret de code en erreur (anti-pattern)** et du **résultat généré dans le rapport d'audit** (Format Observation / Finding / SARIF 2.1.0).

---

### 1. `JavaSpringDriver` & `HexagonalIsolationRule` (`HEX-001`)

* **Rôle** : Vérifie l'isolation stricte de la couche domaine (Hexagonal / Clean Architecture). La couche domaine (`.domain` ou `.core.domain`) ne doit jamais importer de dépendances de frameworks web (`org.springframework.web.*`) ou d'ORM (`jakarta.persistence.*`).
* **Composant cible** : `com.company.auditor.rules.HexagonalIsolationRule`
* **Sévérité** : `CRITICAL` / `HIGH`

#### ❌ Exemple de code en erreur (`OrderDomainService.java`) :
```java
package com.company.domain;

// VIOLATION HEX-001 : Import direct d'annotations Web dans le domaine métier
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
public class OrderDomainService {
    
    @PostMapping("/orders")
    public void processOrder(String orderId) {
        // Logique métier couplée à l'infrastructure Web
    }
}
```

#### 📊 Résultat obtenu dans le rapport (`audit_finding` / SARIF 2.1.0) :
```json
{
  "findingId": "find-hex-001",
  "ruleId": "HEX-001",
  "category": "ARCHITECTURE_BOUNDARY",
  "severity": "HIGH",
  "confidence": 1.0,
  "status": "DETERMINISTIC_VERIFIED",
  "component": "OrderDomainService",
  "locations": [
    {
      "file": "src/main/java/com/company/domain/OrderDomainService.java",
      "lineStart": 4,
      "lineEnd": 5,
      "symbol": "OrderDomainService",
      "snippet": "import org.springframework.web.bind.annotation.RestController;"
    }
  ],
  "expected": "Isolation Hexagonale du domaine",
  "observed": "Hexagonal Boundary Violation: com.company.domain.OrderDomainService imports org.springframework.web.bind.annotation.RestController",
  "impact": "Couplage fort entre le domaine métier et le framework d'infrastructure Web",
  "recommendation": "Déplacer les annotations et contrôleurs Web dans le package adaptateur Web (e.g., com.company.adapter.web)"
}
```

---

### 2. `TransactionalBoundaryRule` (`DB-001`)

* **Rôle** : Détecte les opérations de modification d'état en base de données exécutées en dehors d'une démarcation transactionnelle explicite (`@Transactional`).
* **Composant cible** : `com.company.auditor.rules.TransactionalBoundaryRule`
* **Sévérité** : `HIGH`

#### ❌ Exemple de code en erreur (`PaymentService.java`) :
```java
package com.company.service;

import com.company.repository.PaymentRepository;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    // VIOLATION DB-001 : Absence de @Transactional sur une écriture en BDD
    public void executePayment(PaymentEntity payment) {
        payment.setStatus("COMPLETED");
        paymentRepository.save(payment); // Écriture hors transaction
    }
}
```

#### 📊 Résultat obtenu dans le rapport (`Observation`) :
```json
{
  "observationId": "obs-db-001",
  "ruleId": "DB-001",
  "severity": "HIGH",
  "message": "Transactional Demarcation Violation: PaymentService#executePayment modifies state without an active @Transactional boundary",
  "location": {
    "file": "src/main/java/com/company/service/PaymentService.java",
    "lineStart": 18,
    "lineEnd": 21,
    "symbol": "PaymentService#executePayment",
    "snippet": "paymentRepository.save(payment);"
  },
  "attributes": {
    "className": "com.company.service.PaymentService",
    "methodName": "executePayment",
    "repositoryCall": "PaymentRepository#save"
  }
}
```

---

### 3. `JpaNPlusOneRule` (`ORM-001`)

* **Rôle** : Identifie les accès aux collections chargées paresseusement (`@OneToMany` / `@ManyToMany` `FetchType.LAZY`) à l'intérieur d'une boucle explicite, déclenchant le problème d'explosion de requêtes SQL N+1.
* **Composant cible** : `com.company.auditor.rules.JpaNPlusOneRule`
* **Sévérité** : `HIGH`

#### ❌ Exemple de code en erreur (`CustomerReportService.java`) :
```java
package com.company.service;

import com.company.entity.Customer;
import com.company.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerReportService {

    private final CustomerRepository customerRepository;

    public CustomerReportService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public void generateCustomerOrderSummary() {
        List<Customer> customers = customerRepository.findAll();
        for (Customer customer : customers) {
            // VIOLATION ORM-001 : Accès à la collection LAZY 'getOrders()' dans une boucle sans JOIN FETCH
            int orderCount = customer.getOrders().size(); 
            System.out.println("Customer " + customer.getName() + " orders: " + orderCount);
        }
    }
}
```

#### 📊 Résultat obtenu dans le rapport (`Observation`) :
```json
{
  "observationId": "obs-orm-001",
  "ruleId": "ORM-001",
  "severity": "HIGH",
  "message": "JPA N+1 Query Risk: Lazy collection 'orders' accessed inside loop in CustomerReportService#generateCustomerOrderSummary",
  "location": {
    "file": "src/main/java/com/company/service/CustomerReportService.java",
    "lineStart": 20,
    "lineEnd": 21,
    "symbol": "CustomerReportService#generateCustomerOrderSummary",
    "snippet": "int orderCount = customer.getOrders().size();"
  },
  "attributes": {
    "entityClass": "com.company.entity.Customer",
    "collectionField": "orders",
    "loopLine": 19
  }
}
```

---

### 4. `DeterministicCounterEvidenceEngine` (`KAFKA-001` - Transactional Outbox)

* **Rôle** : Vérifie la cohérence transactionnelle lors de la publication d'événements Kafka suite à une modification BDD. L'envoi direct via `KafkaTemplate.send()` dans une méthode `@Transactional` sans pattern Outbox ni `KafkaTransactionManager` présente un risque élevé d'incohérence/perte de données.
* **Composant cible** : `com.company.auditor.core.validation.DeterministicCounterEvidenceEngine`
* **Sévérité** : `CRITICAL` / `HIGH`

#### ❌ Exemple de code en erreur (`OrderProcessingService.java`) :
```java
package com.company.service;

import com.company.repository.OrderRepository;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderProcessingService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderProcessingService(OrderRepository orderRepository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.orderRepository = orderRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional
    public void createOrder(OrderEntity order) {
        orderRepository.save(order);
        // VIOLATION KAFKA-001 : Publication Kafka directe dans une transaction BDD sans Transactional Outbox
        kafkaTemplate.send("order-topic", order.getId(), order); 
    }
}
```

#### 📊 Résultat obtenu dans le rapport (`Finding`) :
```json
{
  "id": "finding-kafka-001",
  "ruleId": "KAFKA-001",
  "category": "architecture/messaging",
  "severity": "HIGH",
  "confidence": 0.95,
  "status": "DETERMINISTIC_VERIFIED",
  "component": "OrderProcessingService",
  "locations": [
    {
      "file": "src/main/java/com/company/service/OrderProcessingService.java",
      "lineStart": 22,
      "lineEnd": 22,
      "symbol": "OrderProcessingService#createOrder",
      "snippet": "kafkaTemplate.send("order-topic", order.getId(), order);"
    }
  ],
  "expected": "Utilisation du Transactional Outbox Pattern ou d'un KafkaTransactionManager synchronisé",
  "observed": "Écriture BDD suivie d'un kafkaTemplate.send() direct sans propriété spring.kafka.producer.transaction-id-prefix configurée ni table outbox",
  "impact": "Incohérence de données si le commit BDD échoue après l'envoi du message Kafka, ou si Kafka rejette le message après commit BDD",
  "recommendation": "Implémenter la persistance de l'événement dans une table Outbox BDD au sein de la même transaction, puis utiliser Debezium ou un poller applicatif"
}
```

---

### 5. `SpringFrameworkRule` (`SPRING-001` - Field Injection)

* **Rôle** : Décourage l'injection directe sur les champs via `@Autowired` (Field Injection) et impose l'injection par constructeur pour garantir l'immutabilité et faciliter les tests unitaires isolés.
* **Composant cible** : `com.company.auditor.rules.StaticArchitectureRule` (`SPRING-001`)
* **Sévérité** : `MEDIUM`

#### ❌ Exemple de code en erreur (`UserService.java`) :
```java
package com.company.service;

import com.company.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    // VIOLATION SPRING-001 : Injection par champ directe @Autowired
    @Autowired
    private UserRepository userRepository; 

    public void activateUser(String userId) {
        userRepository.updateStatus(userId, "ACTIVE");
    }
}
```

#### 📊 Résultat obtenu dans le rapport (`Observation`) :
```json
{
  "observationId": "obs-spring-001",
  "ruleId": "SPRING-001",
  "severity": "MEDIUM",
  "message": "Field Injection Risk: Direct @Autowired on field 'userRepository' in UserService. Enforce constructor injection.",
  "location": {
    "file": "src/main/java/com/company/service/UserService.java",
    "lineStart": 11,
    "lineEnd": 12,
    "symbol": "UserService#userRepository",
    "snippet": "@Autowired private UserRepository userRepository;"
  },
  "attributes": {
    "targetField": "userRepository",
    "targetClass": "com.company.service.UserService"
  }
}
```
